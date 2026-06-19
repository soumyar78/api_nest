class ApiMonitor < ApplicationRecord
  belongs_to :workspace
  has_many :api_monitor_logs, dependent: :destroy

  validates :name, presence: true
  validates :url, presence: true
  validates :interval_minutes, presence: true, numericality: { greater_than_or_equal_to: 1 }
end
