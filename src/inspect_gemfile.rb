require 'bundler'

empty = '{ "version": "0.0" }'

return puts empty if !File.directory?("#{Dir.pwd}/Gemfile")

deps = Bundler::Definition.build("#{Dir.pwd}/Gemfile", nil, {}).dependencies
deps.each do |dep|
  if dep.name == "percy-capybara"
    puts %Q[{ "name": "#{dep.name}", "version": "#{dep.requirement.as_list.first}" }]
  else
    puts empty
  end
end
