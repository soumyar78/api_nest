class ApiMonitorJob < ApplicationJob
  queue_as :default

  def perform(monitor_id)
    monitor = ApiMonitor.find_by(id: monitor_id)
    return if monitor.nil? || !monitor.is_active?

    workspace = monitor.workspace
    user = workspace.user

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

    monitor.api_monitor_logs.create!(
      response_status: result[:status],
      response_time_ms: result[:time_ms],
      success: success,
      error_message: success ? nil : "HTTP Status #{result[:status]}. Body: #{result[:body].to_s.truncate(200)}"
    )

    monitor.update!(last_checked_at: Time.current)

    unless success
      Notification.create!(
        user: user,
        title: "API Monitor Alert: #{monitor.name} Failed",
        message: "Your scheduled check for '#{monitor.name}' (#{monitor.method} #{monitor.url}) failed with status #{result[:status]}."
      )
    end
  end
end