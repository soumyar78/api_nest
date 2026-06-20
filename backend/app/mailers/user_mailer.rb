class UserMailer < ApplicationMailer
  def reset_password_email(user)
    @user = user
    frontend_url = ENV.fetch("FRONTEND_URL", "http://localhost:5173").strip
    formatted_url = frontend_url.start_with?("http://", "https://") ? frontend_url : "http://#{formatted_url}"
    @reset_url = "#{formatted_url}/reset-password?token=#{@user.reset_password_token}"

    mail(to: @user.email, subject: "Reset your ApiNest Password")
  end
end
