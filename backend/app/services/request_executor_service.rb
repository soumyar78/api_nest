require 'faraday'
require 'benchmark'
require 'base64'

class RequestExecutorService
  def self.execute(workspace:, method:, url:, headers: [], params: [], body_type: 'none', body_content: nil, auth_type: 'none', auth_config: {})
    # 1. Resolve variables in URL
    resolved_url = VariableResolverService.resolve(url, workspace)

    # Clean URL (default to http:// if no scheme is provided)
    unless resolved_url.start_with?('http://', 'https://')
      resolved_url = "http://#{resolved_url}"
    end

    # 2. Build Query Params
    query_params = {}
    if params.is_a?(Array)
      params.each do |p|
        next unless p['enabled'] != false && p['key'].present?
        resolved_key = VariableResolverService.resolve(p['key'], workspace)
        resolved_value = VariableResolverService.resolve(p['value'], workspace)
        query_params[resolved_key] = resolved_value
      end
    end

    # 3. Build Headers
    request_headers = {}
    if headers.is_a?(Array)
      headers.each do |h|
        next unless h['enabled'] != false && h['key'].present?
        resolved_key = VariableResolverService.resolve(h['key'], workspace)
        resolved_value = VariableResolverService.resolve(h['value'], workspace)
        request_headers[resolved_key] = resolved_value
      end
    end

    # 4. Apply Authorization
    auth_config ||= {}
    case auth_type
    when 'bearer'
      token = VariableResolverService.resolve(auth_config['token'], workspace)
      request_headers['Authorization'] = "Bearer #{token}" if token.present?
    when 'basic'
      username = VariableResolverService.resolve(auth_config['username'], workspace)
      password = VariableResolverService.resolve(auth_config['password'], workspace)
      if username.present? || password.present?
        encoded = Base64.strict_encode64("#{username}:#{password}")
        request_headers['Authorization'] = "Basic #{encoded}"
      end
    when 'apiKey'
      key = VariableResolverService.resolve(auth_config['key'], workspace)
      value = VariableResolverService.resolve(auth_config['value'], workspace)
      in_where = auth_config['in'] || 'header' # 'header' or 'query'
      if key.present?
        if in_where == 'query'
          query_params[key] = value
        else
          request_headers[key] = value
        end
      end
    when 'oauth2'
      token = VariableResolverService.resolve(auth_config['accessToken'], workspace)
      request_headers['Authorization'] = "Bearer #{token}" if token.present?
    end

    # 5. Format Request Body
    formatted_body = nil
    if %w[POST PUT PATCH DELETE].include?(method.to_s.upcase)
      resolved_body = VariableResolverService.resolve(body_content, workspace)
      
      case body_type
      when 'json'
        request_headers['Content-Type'] ||= 'application/json'
        formatted_body = resolved_body
      when 'x-www-form-urlencoded'
        request_headers['Content-Type'] ||= 'application/x-www-form-urlencoded'
        formatted_body = resolved_body
      when 'xml'
        request_headers['Content-Type'] ||= 'application/xml'
        formatted_body = resolved_body
      when 'raw'
        request_headers['Content-Type'] ||= 'text/plain'
        formatted_body = resolved_body
      when 'form-data'
        # To make it simple, we treat form-data as key-values represented as JSON in body_content
        # e.g., [{"key": "name", "value": "test"}]
        request_headers['Content-Type'] ||= 'application/x-www-form-urlencoded' # simpler fallback
        begin
          parsed = JSON.parse(resolved_body)
          if parsed.is_a?(Array)
            form_hash = {}
            parsed.each { |item| form_hash[item['key']] = item['value'] if item['key'].present? }
            formatted_body = URI.encode_www_form(form_hash)
          else
            formatted_body = resolved_body
          end
        rescue
          formatted_body = resolved_body
        end
      end
    end

    # 6. Setup Faraday Connection
    connection = Faraday.new(url: resolved_url) do |faraday|
      faraday.options.timeout = 15 # 15 seconds timeout
      faraday.options.open_timeout = 5
      faraday.adapter Faraday.default_adapter
    end

    # 7. Execute Request and measure latency
    response_status = nil
    response_body = nil
    response_headers = {}
    response_size = 0
    latency_ms = 0

    begin
      start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      
      response = connection.run_request(method.to_s.downcase.to_sym, nil, formatted_body, request_headers) do |req|
        req.params.update(query_params) if query_params.present?
      end
      
      end_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      latency_ms = ((end_time - start_time) * 1000).round

      response_status = response.status
      response_body = response.body
      response_headers = response.headers.to_h
      response_size = response_body.to_s.bytesize
    rescue Faraday::Error => e
      response_status = 0
      response_body = "Error executing request: #{e.message}"
      response_headers = { "X-Error" => e.class.name }
      response_size = response_body.bytesize
      latency_ms = 0
    end

    {
      status: response_status,
      body: response_body,
      headers: response_headers,
      size_bytes: response_size,
      time_ms: latency_ms,
      resolved_url: resolved_url
    }
  end
end
