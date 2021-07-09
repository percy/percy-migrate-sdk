require 'bundler'

return puts '{}' if !File.directory?("#{Dir.pwd}/Gemfile")

deps = Bundler::Definition.build("#{Dir.pwd}/Gemfile", nil, {}).dependencies
found = deps.detect { |dep| dep.name == "percy-capybara" }

if found
  puts %Q[{ "name": "#{found.name}", "version": "#{found.requirement.as_list.first}" }]
else
  puts '{}'
end
