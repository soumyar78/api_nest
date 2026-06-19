class Environment < ApplicationRecord
  belongs_to :workspace
  has_many :environment_variables, dependent: :destroy

  validates :name, presence: true, length: { maximum: 100 }

  scope :active, -> { where(is_active: true) }

  # Ensures only one environment is active at a time within a workspace
  def activate!
    transaction do
      workspace.environments.where.not(id: id).update_all(is_active: false)
      update!(is_active: true)
    end
  end
end
