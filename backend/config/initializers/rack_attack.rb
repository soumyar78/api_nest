class Rack::Attack
  # Throttle all requests by IP (100 requests / minute)
  throttle('req/ip', limit: 100, period: 1.minute) do |req|
    req.ip unless req.path.start_with?('/assets')
  end

  # Throttle login and signup attempts by IP (10 requests / minute)
  throttle('logins/ip', limit: 10, period: 1.minute) do |req|
    if req.path == '/api/v1/auth/login' || req.path == '/api/v1/auth/register'
      req.ip
    end
  end

  # Return a custom error response when throttled
  self.throttled_responder = lambda do |request_env|
    match_data = request_env['rack.attack.match_data']
    now = match_data[:epoch_time]

    headers = {
      'Content-Type' => 'application/json',
      'RateLimit-Limit' => match_data[:limit].to_s,
      'RateLimit-Remaining' => '0',
      'RateLimit-Reset' => (now + (match_data[:period] - now % match_data[:period])).to_s
    }

    [429, headers, [{ error: "Rate limit exceeded. Please try again later." }.to_json]]
  end
end
