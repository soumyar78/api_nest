module Api
  module V1
    class ApiController < ApplicationController
      before_action :authenticate_user!

      rescue_from StandardError, with: :handle_standard_error
      rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
      rescue_from ActiveRecord::RecordInvalid, with: :handle_record_invalid

      def current_user
        @current_user
      end

      private

      def authenticate_user!
        header = request.headers["Authorization"]
        header = header.split(" ").last if header

        if header
          decoded = JwtService.decode(header)
          if decoded && decoded[:user_id]
            @current_user = User.find_by(id: decoded[:user_id])
          end
        end

        unless @current_user
          render json: { error: "Unauthorized access" }, status: :unauthorized
        end
      end

      def handle_standard_error(exception)
        logger.error(exception.message)
        logger.error(exception.backtrace.join("\n"))
        render json: { error: "An unexpected error occurred: #{exception.message}" }, status: :internal_server_error
      end

      def handle_not_found(exception)
        render json: { error: "#{exception.model} not found" }, status: :not_found
      end

      def handle_record_invalid(exception)
        render json: { errors: exception.record.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end
end
