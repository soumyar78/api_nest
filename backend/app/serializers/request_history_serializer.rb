class RequestHistorySerializer < Blueprinter::Base
  identifier :id

  fields :user_id, :workspace_id, :request_id, :name, :method, :url, :headers,
         :body_content, :response_status, :response_time_ms, :response_size_bytes,
         :response_body, :response_headers, :created_at
end
