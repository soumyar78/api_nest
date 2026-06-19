require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    it 'requires email, name, and password' do
      user = User.new
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("can't be blank")
      expect(user.errors[:name]).to include("can't be blank")
      expect(user.errors[:password]).to include("can't be blank")
    end

    it 'enforces unique emails' do
      User.create!(email: 'test@example.com', password: 'password123', name: 'Test User')
      duplicate = User.new(email: 'TEST@example.com', password: 'password123', name: 'Duplicate User')
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:email]).to include('has already been taken')
    end

    it 'enforces password length' do
      user = User.new(email: 'test@example.com', password: '123', name: 'Short Password')
      expect(user).not_to be_valid
      expect(user.errors[:password]).to include('is too short (minimum is 6 characters)')
    end
  end

  describe 'callbacks' do
    it 'generates a confirmation token before creation' do
      user = User.new(email: 'test@example.com', password: 'password123', name: 'Unconfirmed User')
      user.save!
      expect(user.confirmation_token).not_to be_nil
      expect(user.confirmed_at).to be_nil
    end
  end

  describe 'helper methods' do
    let(:user) { User.create!(email: 'user@example.com', password: 'password123', name: 'Normal User') }

    it 'handles email confirmation' do
      user.confirm!
      expect(user.confirmed?).to be true
      expect(user.confirmation_token).to be_nil
    end

    it 'manages reset password tokens' do
      user.generate_reset_password_token!
      expect(user.reset_password_token).not_to be_nil
      expect(user.reset_password_sent_at).not_to be_nil
      expect(user.reset_password_expired?).to be false

      user.reset_password!('newpassword123')
      expect(user.reset_password_token).to be_nil
      expect(user.reset_password_sent_at).to be_nil
      expect(user.authenticate('newpassword123')).to eq(user)
    end

    it 'handles refresh token lifecycle' do
      token = user.generate_refresh_token!
      expect(user.refresh_token).to eq(token)
      expect(user.refresh_token_valid?(token)).to be true

      user.revoke_refresh_token!
      expect(user.refresh_token).to be_nil
      expect(user.refresh_token_valid?(token)).to be false
    end
  end
end
