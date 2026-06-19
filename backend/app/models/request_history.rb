class RequestHistory < ApplicationRecord
  belongs_to :user
  belongs_to :workspace

  validates :method, presence: true
  validates :url, presence: true
end
