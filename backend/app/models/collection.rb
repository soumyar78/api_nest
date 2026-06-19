class Collection < ApplicationRecord
  belongs_to :workspace
  has_many :folders, dependent: :destroy
  has_many :requests, dependent: :destroy

  validates :name, presence: true, length: { maximum: 100 }
end
