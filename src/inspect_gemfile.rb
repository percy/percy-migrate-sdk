require 'bundler'

# @TODO actually get the right path
deps = Bundler::Definition.build("#{Dir.pwd}/Gemfile", nil, {}).dependencies
deps.each do |dep|
  if dep.name == "percy-capybara"
    puts %Q[{ "name": "#{dep.name}", "version": "#{dep.requirement.as_list.first}" }]
  else
    puts '{}'
  end
end
