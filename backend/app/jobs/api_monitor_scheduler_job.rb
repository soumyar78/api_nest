class ApiMonitorSchedulerJob < ActiveJob::Base
  queue_as :default

  def perform
    # Find active monitors due for a check
    ApiMonitor.where(is_active: true).find_each do |monitor|
      next if monitor.last_checked_at.present? && monitor.last_checked_at > monitor.interval_minutes.minutes.ago

      ApiMonitorJob.perform_later(monitor.id)
    end
  end
end
