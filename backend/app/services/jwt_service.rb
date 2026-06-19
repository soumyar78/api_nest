class JwtService
  SECRET_KEY = ENV.fetch("JWT_SECRET") { Rails.application.credentials.secret_key_base || "fallback_secret_key_base_api_nest_2026" }

  def self.encode(payload, exp = 15.minutes.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY)[0]
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError
    nil
  end
end
