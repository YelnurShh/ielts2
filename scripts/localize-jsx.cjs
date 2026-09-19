// Translate presentation strings only. Form values and Firestore identifiers stay canonical.
module.exports = function ({ types: t }) {
  function protectedText(path){return !!path.findParent(p=>p.isJSXElement()&&p.node.openingElement.attributes.some(a=>t.isJSXAttribute(a)&&a.name.name==='translate'&&t.isStringLiteral(a.value,{value:'no'})));}
  return { visitor: {
    Program: { exit(path) {
      if (path.node.__localized) path.unshiftContainer('body', t.importDeclaration([t.importSpecifier(t.identifier('__display'), t.identifier('display'))], t.stringLiteral('/src/i18n')));
    } },
    JSXElement: { enter(path) {
      const opening = path.node.openingElement;
      if (t.isJSXIdentifier(opening.name, { name: 'option' }) && !opening.attributes.some(a => t.isJSXAttribute(a) && a.name.name === 'value')) {
        const child = path.node.children.find(c => t.isJSXExpressionContainer(c) || t.isJSXText(c));
        if (child) opening.attributes.push(t.jsxAttribute(t.jsxIdentifier('value'), t.isJSXText(child) ? t.stringLiteral(child.value.trim()) : t.jsxExpressionContainer(t.cloneNode(child.expression, true))));
      }
    } },
    JSXText(path) {
      if(protectedText(path))return;
      const lines=path.node.value.split(/\r\n|\n|\r/);let text='';
      lines.forEach((line,i)=>{let v=line.replace(/\t/g,' ');if(i)v=v.replace(/^ +/,'');if(i<lines.length-1)v=v.replace(/ +$/,'');if(v){text+=v;if(i<lines.length-1)text+=' ';}});
      if (!text.trim()) return;
      path.findParent(p=>p.isProgram()).node.__localized=true;
      path.replaceWith(t.jsxExpressionContainer(t.callExpression(t.identifier('__display'),[t.stringLiteral(text)])));path.skip();
    },
    JSXExpressionContainer: { exit(path) {
      if(protectedText(path))return;
      if (!path.parentPath.isJSXElement() && !path.parentPath.isJSXFragment()) return;
      const e=path.node.expression;if(t.isJSXEmptyExpression(e)||t.isJSXElement(e)||t.isJSXFragment(e)||t.isCallExpression(e)&&t.isIdentifier(e.callee,{name:'__display'}))return;
      // These are personal text, not interface or curriculum copy.
      const code=path.get('expression').toString();
      if (/\b(displayName|initials|studentName)\b/.test(code)||/^(feedback|notes|password|email|g)$/.test(code) || /^[\w?.]+\.(name|feedback)$/.test(code) || /^(essay|previous)\.text$/.test(code))return;
      path.findParent(p=>p.isProgram()).node.__localized=true;
      path.node.expression=t.callExpression(t.identifier('__display'),[e]);
    } },
    JSXAttribute(path) {
      if(protectedText(path))return;
      if(!['placeholder','title','aria-label','alt'].includes(path.node.name.name)||!path.node.value)return;
      const e=t.isStringLiteral(path.node.value)?path.node.value:path.node.value.expression;
      if(t.isIdentifier(e,{name:'displayName'}))return;
      if(!e)return;path.findParent(p=>p.isProgram()).node.__localized=true;
      path.node.value=t.jsxExpressionContainer(t.callExpression(t.identifier('__display'),[e]));
    }
  }};
};
