class UserMailer < ApplicationMailer
  def reset_password_email(user)
    @user = user
    frontend_url = ENV.fetch("FRONTEND_URL", "http://localhost:5173")
    @reset_url = "#{frontend_url}/reset-password?token=#{@user.reset_password_token}"

    mail(to: @user.email, subject: "Reset your ApiNest Password")
  end
end
