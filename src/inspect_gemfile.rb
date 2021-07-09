require 'bundler'

return puts '{}' if !File.directory?("#{Dir.pwd}/Gemfile")

deps = Bundler::Definition.build("#{Dir.pwd}/Gemfile", nil, {}).dependencies

deps.each do |dep|
  if dep.name == "percy-capybara"
    puts %Q[{ "name": "#{dep.name}", "version": "#{dep.requirement.as_list.first}" }]
    break
  else
    puts '{}'
  end
end
