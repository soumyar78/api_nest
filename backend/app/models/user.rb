class User < ApplicationRecord
  has_secure_password

  has_many :workspaces, dependent: :destroy
  has_many :request_histories, dependent: :destroy
  has_many :notifications, dependent: :destroy

  after_commit :seed_default_workspace, on: :create

  validates :email, presence: true, uniqueness: { case_sensitive: false }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :password, presence: true, length: { minimum: 6 }, if: -> { new_record? || password.present? }

  before_create :generate_confirmation_token

  def confirm!
    update(confirmed_at: Time.current, confirmation_token: nil)
  end

  def confirmed?
    confirmed_at.present?
  end

  def generate_reset_password_token!
    update(
      reset_password_token: SecureRandom.urlsafe_base64,
      reset_password_sent_at: Time.current
    )
  end

  def reset_password_expired?
    reset_password_sent_at.nil? || reset_password_sent_at < 2.hours.ago
  end

  def reset_password!(new_password)
    update(
      password: new_password,
      reset_password_token: nil,
      reset_password_sent_at: nil
    )
  end

  def generate_refresh_token!
    token = SecureRandom.hex(30)
    update(
      refresh_token: token,
      refresh_token_expires_at: 7.days.from_now
    )
    token
  end

  def refresh_token_valid?(token)
    refresh_token == token && refresh_token_expires_at.present? && refresh_token_expires_at > Time.current
  end

  def revoke_refresh_token!
    update(refresh_token: nil, refresh_token_expires_at: nil)
  end

  private

  def generate_confirmation_token
    self.confirmation_token = SecureRandom.urlsafe_base64
  end

  def seed_default_workspace
    Workspace.create!(name: "#{name}'s Workspace", user: self)
  end
end
