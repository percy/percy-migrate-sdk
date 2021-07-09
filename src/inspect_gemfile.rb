require 'bundler'
require 'json'

return puts '[]' unless File.exist?("#{Dir.pwd}/Gemfile")

deps = Bundler::Definition.build("#{Dir.pwd}/Gemfile", nil, {}).dependencies

found = deps.reduce([]) do |all, dep|
  next all unless dep.name.start_with? "percy-"
  all << { name: dep.name, version: dep.requirement.as_list.first }
end

puts found.to_json
