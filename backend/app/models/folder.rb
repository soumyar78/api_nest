class Folder < ApplicationRecord
  belongs_to :collection
  belongs_to :parent, class_name: 'Folder', optional: true, foreign_key: :parent_id
  has_many :children, class_name: 'Folder', foreign_key: :parent_id, dependent: :destroy
  has_many :requests, dependent: :destroy

  validates :name, presence: true, length: { maximum: 100 }
end
