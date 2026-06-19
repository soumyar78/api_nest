class RequestSerializer < Blueprinter::Base
  identifier :id

  fields :name, :method, :url, :headers, :params, :body_type, :body_content,
         :auth_type, :auth_config, :collection_id, :folder_id, :workspace_id,
         :created_at, :updated_at
end
