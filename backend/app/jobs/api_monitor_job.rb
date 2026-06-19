class ApiMonitorJob < ApplicationJob
  # Use ActiveJob if standard, or define a standard class
end
# Let's use standard ActiveJob::Base
class ApiMonitorJob < ActiveJob::Base
  queue_as :default

  def perform(monitor_id)
    monitor = ApiMonitor.find_by(id: monitor_id)
    return if monitor.nil? || !monitor.is_active?

    workspace = monitor.workspace
    user = workspace.user

    # Execute request
    result = RequestExecutorService.execute(
      workspace: workspace,
      method: monitor.method,
      url: monitor.url,
      headers: monitor.headers || [],
      params: [],
      body_type: monitor.body_content.present? ? 'raw' : 'none',
      body_content: monitor.body_content
    )

    success = result[:status] >= 100 && result[:status] < 400

    # Create Monitor Log
    monitor.api_monitor_logs.create!(
      response_status: result[:status],
      response_time_ms: result[:time_ms],
      success: success,
      error_message: success ? nil : "HTTP Status #{result[:status]}. Body: #{result[:body].to_s.truncate(200)}"
    )

    # Update last checked timestamp
    monitor.update!(last_checked_at: Time.current)

    # Send Notification/Alert on Failure
    unless success
      Notification.create!(
        user: user,
        title: "API Monitor Alert: #{monitor.name} Failed",
        message: "Your scheduled check for '#{monitor.name}' (#{monitor.method} #{monitor.url}) failed with status #{result[:status]}."
      )
    end
  end
end
