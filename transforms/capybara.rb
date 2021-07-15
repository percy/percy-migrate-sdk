class Transform < Parser::TreeRewriter
  def on_send(node)
    # match 'Percy.snapshot'
    if (node.children[0]&.type == :const and
        node.children[0].loc.name.source == 'Percy' and
        node.children[1] == :snapshot)
      obj_ast, _, page_ast, hash_ast = node.children

      # get the page argument position and name
      page_range = page_ast.loc.expression
      page_var = page_range.source

      # find the `name` snapshot option index
      name_idx = hash_ast.children.index do |item|
        item.children.first.loc.expression.source == 'name'
      end

      # get the actual name, and the range of the ast
      name_ast = hash_ast.children[name_idx]
      name_str = name_ast.children.last.loc.expression.source
      name_range = name_ast.loc.expression

      # if there is a following option, adjust the ast position to include spaces
      if next_ast = hash_ast.children&.[](name_idx + 1)
        name_range = name_range.with(end_pos: next_ast.loc.expression.begin_pos)

      # if there is only a single name option, adjust the ast position to encompass the hash
      elsif hash_ast.children.length === 1
        name_range = hash_ast.loc.expression.with(begin_pos: page_range.end_pos)
      end

      # replace 'Percy' with the page variable
      replace(obj_ast.loc.expression, page_var)
      # replace '.snapshot' with `.percy_snapshot`
      replace(node.loc.selector, 'percy_snapshot')
      # replace the page argument with the snapshot name
      replace(page_range, name_str)
      # remove the name argument from snapshot options
      remove(name_range)
    end
  end
end
