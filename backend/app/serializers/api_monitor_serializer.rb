class ApiMonitorSerializer < Blueprinter::Base
  identifier :id

  fields :workspace_id, :name, :url, :method, :headers, :body_content,
         :interval_minutes, :last_checked_at, :is_active, :created_at, :updated_at

  association :api_monitor_logs, blueprint: ApiMonitorLogSerializer
end
