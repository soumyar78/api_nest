class UserMailer < ApplicationMailer
  def reset_password_email(user)
    @user = user
    
    # Get raw URL or default fallback
    raw_url = ENV["FRONTEND_URL"].presence || "localhost:5173"
    
    # Strip protocol and trailing slashes to normalize
    clean_url = raw_url.strip.gsub(/\Ahttps?:\/\//, "").chomp("/")
    
    # Fallback to localhost if blank or root
    clean_url = "localhost:5173" if clean_url.empty? || clean_url == "/"
    
    # Determine appropriate protocol
    protocol = (clean_url.start_with?("localhost") || clean_url.start_with?("127.0.0.1")) ? "http" : "https"
    
    @reset_url = "#{protocol}://#{clean_url}/reset-password?token=#{@user.reset_password_token}"

    mail(to: @user.email, subject: "Reset your ApiNest Password")
  end
end
