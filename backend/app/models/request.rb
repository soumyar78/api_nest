class Request < ApplicationRecord
  belongs_to :workspace
  belongs_to :collection
  belongs_to :folder, optional: true

  METHODS = %w[GET POST PUT PATCH DELETE OPTIONS HEAD].freeze
  BODY_TYPES = %w[none json form-data x-www-form-urlencoded raw xml].freeze
  AUTH_TYPES = %w[none bearer basic apiKey oauth2].freeze

  validates :name, presence: true, length: { maximum: 100 }
  validates :method, presence: true, inclusion: { in: METHODS }
  validates :url, presence: true
  validates :body_type, inclusion: { in: BODY_TYPES }, allow_nil: true
  validates :auth_type, inclusion: { in: AUTH_TYPES }, allow_nil: true
end
