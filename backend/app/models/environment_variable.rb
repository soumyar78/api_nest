class EnvironmentVariable < ApplicationRecord
  belongs_to :environment

  validates :key, presence: true, uniqueness: { scope: :environment_id }
end
