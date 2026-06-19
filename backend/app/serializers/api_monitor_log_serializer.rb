class ApiMonitorLogSerializer < Blueprinter::Base
  identifier :id

  fields :api_monitor_id, :response_status, :response_time_ms, :success,
         :error_message, :created_at
end
