class App extends React.Component {
  constructor(props) {
    super(props);
    var node = localStorage.getItem('node');
     if (node){
       node = CircularJSON.parse(node);
     } else {
       node  = {children: [], orientation: 'absolute'};
     }
    this.state = {
      node: node
    }
  }

  componentWillUpdate(nextProps, nextState) {
    localStorage.setItem('node', CircularJSON.stringify(nextState.node));
  }




  newCursor(node, comp, e) {
    if (e.target.className.match(/\bchildren\b/) && document.elementFromPoint(e.clientX,e.clientY) === e.target) {
      e.preventDefault();

      var domEl = React.findDOMNode(comp.refs.children);

     node.children.push({
        parent: node,
        children: [],

        text: '',
        focus: true,
        position: {
          left: e.clientX + domEl.scrollLeft,
          top: e.clientY + domEl.scrollTop - 8,
        },
       textareaSize: {
         width: 10,
         height: 16
       }
      });
      this.setState({});
    }
  }

  textChange(node, e) {
    node.text = e.target.value;
    var classes = e.target.className;
    e.target.className = classes  + ' minSize';
    node.textareaSize.height = e.target.scrollHeight;
    node.textareaSize.width = e.target.scrollWidth;
    e.target.className = classes;
    this.setState({});
  }


  textBlur(node){
    if(node.text == '' && !node.children.length){
      node.parent.children.splice(node.parent.children.indexOf(node), 1)
    }
    node.focus = false;
    this.setState({});
  }

  textSelect(node, e){
    if (node.focus) {
      node.selectionStart = e.target.selectionStart;
      node.selectionEnd = e.target.selectionEnd;
      this.setState({});
    }
  }

  nodeClick(node, e) {
    e.stopPropagation();
    if (this.state.justEndedAction) {
      this.state.justEndedAction = false;
      //this.setState({});
    } else {
      node.focus = true;
      this.setState({currentFocusNode: node});
    }
  }






  componentDidMount() {
    document.addEventListener('mouseup', this.endAction.bind(this));
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.endAction.bind(this));
  }


  startDrag(node, comp, floatParentComp, e) {
    e.stopPropagation();

    if (!node.focus || node.focus && e.metaKey) {
      if(node.focus && e.metaKey){
        e.preventDefault();
      }

      var size = React.findDOMNode(comp).getBoundingClientRect();

      this.setState({
        currentAction: 'drag',
        currentNode: node,
        elMouseOffset: {
          left: e.clientX  - size.left,
          top: e.clientY - size.top
        },
        currentFloatParentComp: floatParentComp
      });

    }
  }


  onMouseMove(hoverNode, comp, e) {
    var currentAction = this.state.currentAction;
    if (currentAction) {
      e.preventDefault();

      if (currentAction == 'drag') {

        var node = this.state.currentNode;
        var floatParentEl = React.findDOMNode(this.state.currentFloatParentComp.refs.children);

        node.position.left = e.clientX - this.state.elMouseOffset.left + floatParentEl.scrollLeft;
        node.position.top = e.clientY - this.state.elMouseOffset.top + floatParentEl.scrollTop;

        this.setState({justEndedAction: true});
      }
    }
  }

  endAction(e){
    if(this.state.currentAction) {
      this.setState({
        currentAction: null,
        currentNode: null,
        currentFloatParentComp: null
      })
    }
  }






  render() {
    return (
        <div className="app">
        <QNode node={this.state.node}
               newCursor={this.newCursor.bind(this)}
               textBlur={this.textBlur.bind(this)}
               textChange={this.textChange.bind(this)}
               textSelect={this.textSelect.bind(this)}
               nodeClick={this.nodeClick.bind(this)}

               startDrag={this.startDrag.bind(this)}
               onMouseMove={this.onMouseMove.bind(this)}
               currentAction={this.state.currentAction}
            />
          </div>
    )
  }
}

class QNode extends React.Component {

  componentDidMount() {
    var node = this.props.node;
    if (this.refs.textarea) {
      var domEl = React.findDOMNode(this.refs.textarea);
      if (node.focus) {
        if (node.selectionEnd - node.selectionStart > 0) {
          domEl.selectionStart = node.selectionStart;
          domEl.focus();
          domEl.selectionEnd = node.selectionEnd;
        } else {
          if (node.selectionEnd) {
            domEl.selectionStart = node.selectionStart;
            domEl.selectionEnd = node.selectionEnd;
          } else {
            domEl.selectionStart = node.text.length;
            domEl.selectionEnd = node.text.length;
          }
          domEl.focus();
          domEl.scrollTop = node.scrollTop;
          domEl.scrollLeft = node.scrollLeft;
        }


        var classes = domEl.className;
        domEl.className = classes + ' minSize';
        node.textareaSize.height = domEl.scrollHeight;
        node.textareaSize.width = domEl.scrollWidth;
        domEl.className = classes;
        this.setState({});

      } else {
        domEl.scrollTop = node.scrollTop;
        domEl.scrollLeft = node.scrollLeft;
      }
    }
  }

  componentDidUpdate() {
    var node = this.props.node;
    if(this.refs.textarea){
      var domEl = React.findDOMNode(this.refs.textarea);
      if (node.focus /*&& document.activeElement !== domEl*/) {
        if(node.selectionEnd - node.selectionStart > 0){
          domEl.selectionStart = node.selectionStart;
          domEl.focus();
          domEl.selectionEnd = node.selectionEnd;
        } else {
          domEl.focus();
        }
      } else if(!node.focus && document.activeElement === domEl) {
        domEl.blur();
      }
    }
  }

  render() {
    var node = this.props.node;

    var nodeClasses = classNames('node', {
      focus: node.focus,
      cursor: node.text == '' && !node.children.length,
      floatNode: node.position
    });

    return (
        <div className={nodeClasses} style={node.position}
             onMouseDown={node.parent && this.props.startDrag.bind(null, node, this, this.props.floatParent)}
             onMouseMoveCapture={this.props.currentAction && this.props.onMouseMove.bind(null, node, this)}
          >
          <div className="content">
            <textarea ref="textarea" value={node.text} style={node.textareaSize}
                      onClick={this.props.nodeClick.bind(null, node)}
                      onBlur={this.props.textBlur.bind(null, node)}
                      onChange={this.props.textChange.bind(null, node)}
                      onSelect={this.props.textSelect.bind(null, node)}
                  />
          </div>

          <div ref="children" className="children" onClick={node.orientation == 'absolute' && this.props.newCursor.bind(null, node, this)}>
            {node.children.map(function (child, i) {
              return <QNode {...(assign({}, this.props, node.orientation == 'absolute' ? {floatParent: this} : {}))} key={i} node={child}/>
            }.bind(this))}
          </div>

        </div>
    )
  }
}

React.render(<App/>, document.body);