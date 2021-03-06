class App extends React.Component {
  constructor(props) {
    super(props);
    var node = localStorage.getItem('node3');

    var tree = {};
    var wordsNode = { parent: tree, position: {top: 100, left: 100, zIndex: 1}, orientation: 'vertical', expanded: true, text: 'Существительные', textareaSize: {}, children: Object.keys(words)};
     if (node){
       node = CircularJSON.parse(node);
     } else {
       node  = assign(tree, {
         children: [wordsNode],
         orientation: 'absolute',
         maxChildrenZIndex: 2,
         expanded: true,
         root: true,
         parent: {children: []},
         text: '',
         textareaSize: {
           width: 10,
           height: 17
         }
       });
     }
    this.state = {
      node: node,
      hoverNodes: [],
      wordsNode: wordsNode
    }
  }

  componentWillUpdate(nextProps, nextState) {
    console.log('update');
    if (this.timeOutId) {
      window.clearTimeout(this.timeOutId);
    };
    this.timeOutId = window.setTimeout(function(){
      console.log('store');
      localStorage.setItem('node3', CircularJSON.stringify(nextState.node));
    }.bind(this), 1000)
  }





  newCursor(node, comp, e) {
    if (e.target.className.match(/\bchildren\b/) && document.elementFromPoint(e.clientX,e.clientY) === e.target) {
      e.preventDefault();

      var domEl = React.findDOMNode(comp.refs.children);

      var domPos = domEl.getBoundingClientRect();

     node.children.push({
        parent: node,
        children: [],

        text: '',
        focus: true,
        position: {
          left: e.clientX - domPos.left + domEl.scrollLeft,
          top: e.clientY - domPos.top + domEl.scrollTop - 8,
          zIndex: 1
        },
       textareaSize: {
         width: 10,
         height: 17
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


  onDrop(node, comp, e){

    var domEl = React.findDOMNode(comp.refs.children);

    if(e.target == domEl) {
      node.children.push({
        parent: node,
        text: e.dataTransfer.getData("text/plain"),
        focus: true,
        position: {
          left: e.clientX + domEl.scrollLeft - 8,
          top: e.clientY + domEl.scrollTop - 8,
          zIndex: 1
        },
        textareaSize: {},
        children: []
      });
      var focusNode = this.state.currentFocusNode;
      if (focusNode){
        focusNode.text = focusNode.text.slice(0, focusNode.selectionStart) + focusNode.text.slice(focusNode.selectionEnd, focusNode.text.length);
        focusNode.selectionEnd = focusNode.selectionStart;
      }
      this.setState({});
    }
  }

  onDragOver(node, comp, e){
    var domEl = React.findDOMNode(comp.refs.children);
    e.stopPropagation();
    if(e.target == domEl){
      e.preventDefault();
    }
  }


  handleChildrenScroll(node, e){

    if (this.state.currentAction == 'drag') {
      var diffScrollX = e.target.scrollLeft - node.childrenScrollLeft;
      var diffScrollY = e.target.scrollTop - node.childrenScrollTop;

      var currentNode = this.state.currentNode;
      currentNode.position.left += diffScrollX;
      currentNode.position.top += diffScrollY;
    }


    node.childrenScrollLeft = e.target.scrollLeft;
    node.childrenScrollTop = e.target.scrollTop;
    if (this.scrollTimeOutId){
      window.clearTimeout(this.scrollTimeOutId);
    }

    this.scrollTimeOutId = window.setTimeout(function(){
      this.setState({});
    }.bind(this), 1000);
  }






  componentDidMount() {
    document.addEventListener('mouseup', this.endAction.bind(this));
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.endAction.bind(this));
  }


  startDrag(node, comp, e) {
    e.stopPropagation();

    if (!node.focus || node.focus && e.metaKey) {
      if(node.focus && e.metaKey){
        e.preventDefault();
      }

      if (node.position && node.position.zIndex < node.parent.maxChildrenZIndex){
        node.position.zIndex = node.parent.maxChildrenZIndex +1;
        node.parent.maxChildrenZIndex +=1;
      }

      var size = React.findDOMNode(comp).getBoundingClientRect();

      this.setState({
        currentAction: 'drag',
        currentNode: node,
        elMouseOffset: {
          left: e.clientX  - size.left,
          top: e.clientY - size.top
        },
      });

    }
  }

  startResize(node, comp, nodeElFunc, resizer, e) {
    e.preventDefault();
    e.stopPropagation();

    var size = nodeElFunc().getBoundingClientRect();

    this.setState({
      currentAction: 'resize',
      currentNode: node,
      currentNodeElFunc: nodeElFunc,
      resizer: resizer,
      currentComp: comp,
      mousePos: {
        top: e.clientY,
        left: e.clientX
      }
    });
  }


  onMouseMove(hoverNode, comp, e) {
    var currentAction = this.state.currentAction;
    if (currentAction) {
      e.preventDefault();

      if (currentAction == 'drag') {

        var node = this.state.currentNode;
        var floatParentEl = React.findDOMNode(this.refs.children);
        var floatParentElPos = floatParentEl.getBoundingClientRect();




        //move up to float parent
        node.parent.children.splice(node.parent.children.indexOf(node), 1);

        var nnode = node;
        while ((nnode.parent.orientation == 'vertical' || nnode.parent.orientation == 'horizontal') && nnode.parent.children.length == 1 && nnode.parent.text == ''){
          nnode = nnode.parent;
          var other = nnode.children[0];
          if(!nnode.root){
            nnode.parent.children[nnode.parent.children.indexOf(nnode)] = other;
          } else {
            this.state.node = other;
            other.root = true;
            break;
          }
        }
        if (!nnode.root && nnode.orientation == 'horizontal' && nnode.children.length == 1) nnode.orientation = 'vertical';

        var parentNode = this.state.node;
        parentNode.children.push(node);
        node.parent = parentNode;
        if(!node.position) node.position = {zIndex: 1};

        if (node.position.zIndex < node.parent.maxChildrenZIndex){
          node.position.zIndex = node.parent.maxChildrenZIndex +1;
          node.parent.maxChildrenZIndex +=1;
        }

        if (this.state.inAction && hoverNode !== node && hoverNode.orientation != 'absolute') {
          this.state.inHover = true;
          node.position.left = e.clientX + floatParentEl.scrollLeft;
          node.position.top = e.clientY + floatParentEl.scrollTop;
        } else {
          this.state.inHover = false;
          node.position.left = e.clientX - floatParentElPos.left - this.state.elMouseOffset.left + floatParentEl.scrollLeft;
          node.position.top = e.clientY - floatParentElPos.top - this.state.elMouseOffset.top + floatParentEl.scrollTop;
        }





        //find dock position
        this.state.inAction = true;
        var nodePos = React.findDOMNode(comp).getBoundingClientRect();
        var side;
        var aStyle;

        if (e.pageX < nodePos.left + nodePos.width/100 * 10) {
          //side = 'left';
        } else if (e.pageX > nodePos.left + nodePos.width - nodePos.width/100 * 10 && e.pageX < nodePos.left + nodePos.width) {
          //side = 'right'
        } else if ((e.pageY < nodePos.top + nodePos.height/100 * 10) ||
          nodePos.height < 25 && e.pageY < nodePos.top + nodePos.height/2) {
          side = 'top';
        } else if ((e.pageY > nodePos.top + nodePos.height - nodePos.height/100 * 10 && e.pageY < nodePos.top + nodePos.height) ||
          nodePos.height < 25 && (e.pageY > nodePos.top + nodePos.height - nodePos.height/2 && e.pageY < nodePos.top + nodePos.height) ) {
          side = 'bottom'
        }
        if (!e.target.className.match(/\bcontent\b/) && side && node !== hoverNode) {
          e.stopPropagation();

          aStyle = {
            width: side == 'left' || side == 'right' ? nodePos.width/2 : nodePos.width,
            height: side == 'top' || side == 'bottom' ? nodePos.height/2 : nodePos.height
          };

          var relatedSize = {
            left: 'width',
            right: 'width',
            top: 'height',
            bottom: 'height'
          };

          aStyle.left = side != 'right' ? nodePos.left : nodePos['left'] + nodePos[relatedSize[side]] - aStyle[relatedSize[side]];
          aStyle.top = side != 'bottom' ? nodePos.top : nodePos['top'] + nodePos[relatedSize[side]] - aStyle[relatedSize[side]];


          this.state.anchor = true;
          this.state.hoverNode = hoverNode;
          this.state.dockInfo = {
            side: side
          };
          this.state.anchorStyle = aStyle

        } else {
          this.state.anchor = false;
        }



        this.setState({justEndedAction: true});
      }


      if (currentAction == 'resize') {
        var node = this.state.currentNode;
        var resizer = this.state.resizer;
        var nodePos = this.state.currentNodeElFunc().getBoundingClientRect();


        var diffMouseX = e.clientX - this.state.mousePos.left;
        var diffMouseY = e.clientY - this.state.mousePos.top;


        if (!node.childrenSize) node.childrenSize = {};
        if (!node.contentSize) node.contentSize = {};


        if (resizer == 'width-height') {
          if(node.children.length) {
            if(!node.childrenSize.width) node.childrenSize.width = nodePos.width;
            if(!node.childrenSize.height) node.childrenSize.height = nodePos.height;
            node.childrenSize.width += diffMouseX;
            node.childrenSize.height += diffMouseY;

          } else {
            if(!node.contentSize.width) node.contentSize.width = nodePos.width;
            if(!node.contentSize.height) node.contentSize.height = nodePos.height;
            node.contentSize.width += diffMouseX;
            node.contentSize.height += diffMouseY;
          }
        }

        this.state.mousePos = {
          top: e.clientY,
          left: e.clientX
        };
        this.setState({});
      }
    }
  }

  endAction(e){
    if(this.state.currentAction == 'drag' && this.state.anchor) {
      this.dockNode();
    }

    if(this.state.currentAction) {
      this.setState({
        currentAction: null,
        currentNode: null,
        anchor: false,
        inAction: false,
        inHover: false,
        mousePos: null,
      })
    }
  }

  dockNode(){
    var node = this.state.hoverNode;
    var side = this.state.dockInfo.side;

    var currentNode = this.state.currentNode;


    if(!node.root && ((side == 'top' || side == 'bottom') && node.parent.orientation == 'vertical' || (side == 'left' || side == 'right') && node.parent.orientation == 'horizontal')) {
      if (side == 'top' || side == 'left') {
        node.parent.children.splice( node.parent.children.indexOf(node), 0, currentNode)
      } else {
        node.parent.children.splice( node.parent.children.indexOf(node) + 1, 0, currentNode)
      }

      currentNode.parent.children.splice(currentNode.parent.children.indexOf(currentNode), 1);

      currentNode.parent = node.parent;
      currentNode.position = null;

    } else {

      var newNode = {
        expanded: true,
        text: '',
        textareaSize: {
          width: 10,
          height: 16
        },
        parent: node.parent,
        orientation: ((side == 'top' || side == 'bottom') && 'vertical' ) || ((side == 'left' || side == 'right') && 'horizontal' )
      };

      node.parent.children[node.parent.children.indexOf(node)] = newNode;

      if(node.parent.orientation == 'absolute'){
        newNode.position = node.position
      }

      if (side == 'top' || side == 'left') {
        newNode.children = [currentNode, node]
      } else {
        newNode.children = [node, currentNode]
      }

      currentNode.position = null;
      node.position = null;

      currentNode.parent.children.splice(currentNode.parent.children.indexOf(currentNode), 1);

      node.parent = newNode;
      currentNode.parent = newNode;

      if(node.root) {
        this.state.node = newNode;
        node.root = false;
        newNode.root = true;
      }

    }
  }


  textKeyDown(node, e) {
    if (e.keyCode == 13 && e.shiftKey){
      e.preventDefault();


      var parent;
      if (!node.position){
        if (e.altKey){
          parent = node;
        } else {
          parent = node.parent;
        }
      } else {
        if (e.altKey){
          parent = node;
        } else {

          var newNode = {
            expanded: true,
            text: '',
            textareaSize: {
              width: 10,
              height: 17
            },
            parent: node.parent,
            children: [node],
            position: node.position,
            orientation: 'vertical'
          };

          node.parent.children[node.parent.children.indexOf(node)] = newNode;
          node.position = null;
          node.parent = newNode;

          parent = newNode;

        }
      }

      if (!parent.orientation) parent.orientation = 'vertical';
      parent.expanded = true;

      var index = parent.children.indexOf(node) > -1 ? parent.children.indexOf(node) + 1 : 0;

      parent.children.splice(index,0 , {
        parent: parent,
        text: '',
        focus: true,
        textareaSize: {
          width: 10,
          height: 17
        },
        children: []
      });
      this.setState({});
    }
  }

  expandChildren(node, e){
    e.preventDefault();
    e.stopPropagation();
    node.expanded = !node.expanded;
    this.setState({});
  }

  contentScroll(node, e){
    node.contentScrollTop = e.target.scrollTop;
    node.contentScrollLeft = e.target.scrollLeft;
    this.setState({});
  }


  openClose(word, hoverNode, comp, e){
    e.stopPropagation();
    this.state.hoverNodes.splice(this.state.hoverNodes.indexOf(hoverNode)+1);

    var floatParentEl = React.findDOMNode(this.refs.children);

    this.state.hoverNodes.push({
      word: word,
      position: {left: e.clientX +  floatParentEl.scrollLeft, top: e.clientY + floatParentEl.scrollTop}
    });
    this.setState({});
  }

  hideHoverNodes(hoverNode){
    if(hoverNode) {
      this.state.hoverNodes.splice(this.state.hoverNodes.indexOf(hoverNode) + 1);
    } else {
      this.state.hoverNodes = [];
    }
    this.setState({});
  }


  render() {
    var node = this.state.node;
    return (
        <div className="app">
          <div className="children" ref="children"
               onMouseMoveCapture={this.state.currentAction && this.onMouseMove.bind(this, node, this)}
               onClick={this.newCursor.bind(this, node, this)}
               onScroll={this.handleChildrenScroll.bind(this, node)}
               onDragOver={this.onDragOver.bind(this, node, this)}
               onDrop={this.onDrop.bind(this, node, this)}>
          {node.children.map(function (child, i) {
            return (<QNode key={i} node={child}

                           textBlur={this.textBlur.bind(this)}
                           textChange={this.textChange.bind(this)}
                           textSelect={this.textSelect.bind(this)}
                           nodeClick={this.nodeClick.bind(this)}


                           startDrag={this.startDrag.bind(this)}
                           onMouseMove={this.onMouseMove.bind(this)}
                           currentAction={this.state.currentAction}


                           textKeyDown={this.textKeyDown.bind(this)}
                           expandChildren={this.expandChildren.bind(this)}


                           startResize={this.startResize.bind(this)}
                           contentScroll={this.contentScroll.bind(this)}


                           currentNode={this.state.currentNode}
                           inAction={this.state.inAction}
                           inHover={this.state.inHover}

                           handleChildrenScroll={this.handleChildrenScroll.bind(this)}

                           openClose={this.openClose.bind(this)}

                           wordsNode={this.state.wordsNode}


            />)
          }.bind(this))}


          {this.state.hoverNodes.map(function(hoverNode, i){
            return words[hoverNode.word] ? <div className="hoverWordContent" onClick={this.hideHoverNodes.bind(this, hoverNode)} style={assign({}, hoverNode.position, {zIndex: 100000+i})}>
              <div className="wordHeader">
                <div className="word">{words[hoverNode.word].word}</div>
              </div>
              <div className="definition">
                <div className="column1">
                  {words[hoverNode.word].definitions.map((def)=>{ return (<div className="def-row">{def.word}</div>)})}
                </div>
                <div className="column2">
                  {words[hoverNode.word].definitions.map((def)=>{ return (
                      <div className="def-row"> { def.translations.map((word)=> {return <span onClick={this.openClose.bind(this, word, hoverNode, this)}>{word}</span>})}</div>
                  )})}
                </div>
              </div>
            </div> : null;
          }.bind(this))}



          {this.state.anchor ? <div className="dockside" style={this.state.anchorStyle}></div> : null}

          </div>
          </div>
    )
  }
}

class QNode extends React.Component {

  shouldComponentUpdate(nextProps, nextState){
    return nextProps.node !== this.props.wordsNode
  }

  componentDidMount() {
    var node = this.props.node;
    if (this.refs.textarea) {
      var domEl = React.findDOMNode(this.refs.textarea);
      //var domElContent = React.findDOMNode(this.refs.content);
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
          domEl.scrollTop = node.contentScrollTop;
          domEl.scrollLeft = node.contentScrollLeft;
        }

      } else {
        domEl.scrollTop = node.contentScrollTop;
        domEl.scrollLeft = node.contentScrollLeft;
      }

      if(node.textareaSize) {
        var classes = domEl.className;
        domEl.className = classes + ' minSize';
        node.textareaSize.height = domEl.scrollHeight;
        node.textareaSize.width = domEl.scrollWidth;
        domEl.className = classes;
        this.setState({});
      }

    }

    if(this.refs.children) {
      var domElChildren = React.findDOMNode(this.refs.children);
      domElChildren.scrollTop = node.childrenScrollTop;
      domElChildren.scrollLeft = node.childrenScrollLeft;
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
      floatNode: node.position,
      staticNode: !node.position,
      cursor: node.position && node.text == '' && !node.children.length,


      inDrag: this.props.inAction && this.props.currentNode === node,
      inHover: this.props.inHover && this.props.currentNode === node,
    }, node.orientation);

    return (
      <div className={nodeClasses} style={node.position}
           onMouseDown={node.parent && this.props.startDrag.bind(null, node, this)}
           onMouseMoveCapture={this.props.currentAction && this.props.onMouseMove.bind(null, node, this)}
           onClick={this.props.hideHoverNodes}

        >
        <div className={classNames('content', {hasChildren: node.children.length && node.expanded, word: node.word}, node.orientation)}>

          {node.children.length ?
            <div className={classNames("icon",  node.expanded ? "open" : "closed")}
                 onClick={this.props.expandChildren.bind(null, node)}/>
            :null}

          {node.word ?
            <div className="wordHeader">
              <div className="word" onClick={this.props.openClose.bind(null, node.word, null, null)}>
                {this.props.attr == 'col1' && node.word}
                {this.props.attr == 'col2' && node.definitions.map((def)=> { return def.word}).slice(0, 3).join(', ')}
                {!this.props.attr && node.word + ' ' + node.definitions.map((def)=> { return def.word}).slice(0, 3).join(', ') }
              </div>
            </div>



              : this.props.attr != 'col2' && <textarea ref="textarea" value={node.text} style={assign(node.textareaSize || {}, node.contentSize || {},node.childrenSize && node.childrenSize.width ? {width: node.childrenSize.width} : {})}
                      onClick={this.props.nodeClick.bind(null, node)}
                      onBlur={this.props.textBlur.bind(null, node)}
                      onChange={this.props.textChange.bind(null, node)}
                      onSelect={this.props.textSelect.bind(null, node)}
                      onKeyDown={this.props.textKeyDown.bind(null, node)}
                      onScroll={this.props.contentScroll.bind(null, node)}
              />}

        </div>





        <div ref="children" className={'children '+ (node.children.length && node.expanded ? node.orientation : 'noChildren')} style={node.children.length && node.expanded ?  node.childrenSize : {}}
             onScroll={this.props.handleChildrenScroll.bind(null, node)}>


          <div className="childrenTable">
            <div className="column1">
              {node.expanded ? node.children.map(function (child, i) {
                return (
                    <QNode {...(assign({}, this.props, {attr: 'col1'}))} key={i} node={typeof child == 'string' ? assign({parent: node}, words[child]) : child}/>)
              }.bind(this)) : null}
            </div>
            <div className="column2">
              {node.expanded ? node.children.map(function (child, i) {
                return (
                    <QNode {...(assign({}, this.props, {attr: 'col2'}))} key={i} node={typeof child == 'string' ? assign({parent: node}, words[child]) : child}/>)
              }.bind(this)) : null}
            </div>
          </div>

        </div>



        {node.position ?
          <div className="resizer resize-corner" onMouseDown={this.props.startResize.bind(null, node, this, ()=> React.findDOMNode(node.children.length && node.expanded ? this.refs.children : this.refs.textarea), 'width-height')}></div>
          : null}




      </div>
    )
  }
}

React.render(<App/>, document.getElementById('notes'));