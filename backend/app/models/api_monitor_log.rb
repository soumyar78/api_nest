class ApiMonitorLog < ApplicationRecord
  belongs_to :api_monitor

  validates :created_at, presence: true
end
