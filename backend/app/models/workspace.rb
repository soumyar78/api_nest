class Workspace < ApplicationRecord
  belongs_to :user

  has_many :collections, dependent: :destroy
  has_many :requests, dependent: :destroy
  has_many :environments, dependent: :destroy
  has_many :api_monitors, dependent: :destroy
  has_many :request_histories, dependent: :destroy

  validates :name, presence: true, length: { maximum: 100 }
end
