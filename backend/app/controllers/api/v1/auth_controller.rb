module Api
  module V1
    class AuthController < ApiController
      skip_before_action :authenticate_user!, only: [:register, :login, :refresh, :confirm_email, :forgot_password, :reset_password, :logout]

      # POST /api/v1/auth/register
      def register
        user = User.new(register_params)
        if user.save
          # Automatically confirm email since mailer is not configured
          user.confirm!

          render json: { message: "Registration successful. You can now log in." }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/auth/login
      def login
        user = User.find_by(email: params[:email]&.downcase)
        if user&.authenticate(params[:password])
          unless user.confirmed?
            return render json: { error: "Please confirm your email before logging in." }, status: :forbidden
          end

          access_token = JwtService.encode({ user_id: user.id })
          refresh_token = user.generate_refresh_token!
          set_refresh_token_cookie(refresh_token)

          render json: {
            access_token: access_token,
            user: UserSerializer.render_as_hash(user)
          }, status: :ok
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      # POST /api/v1/auth/refresh
      def refresh
        refresh_token = Rails.env.test? ? cookies[:refresh_token] : cookies.signed[:refresh_token]
        if refresh_token.blank?
          return render json: { error: "Refresh token missing" }, status: :unauthorized
        end

        user = User.find_by(refresh_token: refresh_token)
        if user && user.refresh_token_valid?(refresh_token)
          access_token = JwtService.encode({ user_id: user.id })
          new_refresh_token = user.generate_refresh_token!
          set_refresh_token_cookie(new_refresh_token)

          render json: {
            access_token: access_token,
            user: UserSerializer.render_as_hash(user)
          }, status: :ok
        else
          render json: { error: "Invalid or expired refresh token" }, status: :unauthorized
        end
      end

      # POST /api/v1/auth/logout
      def logout
        header = request.headers["Authorization"]
        header = header.split(" ").last if header
        if header
          decoded = JwtService.decode(header) rescue nil
          if decoded && decoded[:user_id]
            user = User.find_by(id: decoded[:user_id])
            user.revoke_refresh_token! if user
          end
        end

        refresh_token = Rails.env.test? ? cookies[:refresh_token] : cookies.signed[:refresh_token]
        if refresh_token.present?
          user_by_cookie = User.find_by(refresh_token: refresh_token)
          user_by_cookie.revoke_refresh_token! if user_by_cookie
        end

        cookies.delete(:refresh_token, path: '/api/v1/auth')
        render json: { message: "Logged out successfully" }, status: :ok
      end

      # GET /api/v1/auth/confirm
      def confirm_email
        user = User.find_by(confirmation_token: params[:token])
        if user
          user.confirm!
          render json: { message: "Email confirmed successfully. You can now log in." }, status: :ok
        else
          render json: { error: "Invalid or expired confirmation token" }, status: :not_found
        end
      end

      # POST /api/v1/auth/forgot-password
      def forgot_password
        user = User.find_by(email: params[:email]&.downcase)
        if user
          user.generate_reset_password_token!
          # Log token in development so we can copy-paste it during testing
          Rails.logger.info "RESET PASSWORD TOKEN FOR #{user.email}: #{user.reset_password_token}"
        end

        render json: { message: "If the email exists, a reset link has been sent." }, status: :ok
      end

      # POST /api/v1/auth/reset-password
      def reset_password
        user = User.find_by(reset_password_token: params[:token])
        if user && !user.reset_password_expired?
          if params[:password].present? && params[:password].length >= 6
            user.reset_password!(params[:password])
            render json: { message: "Password updated successfully. You can now log in." }, status: :ok
          else
            render json: { error: "Password must be at least 6 characters." }, status: :unprocessable_entity
          end
        else
          render json: { error: "Invalid or expired reset token" }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/auth/me
      def me
        render json: { user: UserSerializer.render_as_hash(current_user) }, status: :ok
      end

      # PATCH /api/v1/auth/profile
      def update_profile
        new_email = params[:email]&.strip&.downcase

        # Check email uniqueness only if the user is actually changing their email
        if new_email.present? && new_email != current_user.email
          if User.where.not(id: current_user.id).exists?(email: new_email)
            return render json: {
              error: "This email address is already associated with another account. Please use a different one."
            }, status: :unprocessable_entity
          end
        end

        if current_user.update(profile_params)
          render json: { user: UserSerializer.render_as_hash(current_user), message: "Profile updated successfully." }, status: :ok
        else
          render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def register_params
        params.permit(:email, :password, :name)
      end

      def profile_params
        params.permit(:name, :email)
      end

      def set_refresh_token_cookie(token)
        if Rails.env.test?
          cookies[:refresh_token] = token
        else
          cookies.signed[:refresh_token] = {
            value: token,
            httponly: true,
            secure: Rails.env.production?,
            same_site: Rails.env.production? ? :none : :lax,
            expires: 7.days.from_now,
            path: '/api/v1/auth'
          }
        end
      end
    end
  end
end
