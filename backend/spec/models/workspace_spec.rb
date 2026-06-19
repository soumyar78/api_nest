require 'rails_helper'

RSpec.describe Workspace, type: :model do
  let(:user) { User.create!(name: 'Test Owner', email: 'owner@example.com', password: 'password123') }

  it 'is valid with valid attributes' do
    workspace = Workspace.new(name: 'My Workspace', user: user)
    expect(workspace).to be_valid
  end

  it 'is invalid without a name' do
    workspace = Workspace.new(name: nil, user: user)
    expect(workspace).not_to be_valid
  end

  it 'belongs to a user' do
    association = described_class.reflect_on_association(:user)
    expect(association.macro).to eq :belongs_to
  end
end
