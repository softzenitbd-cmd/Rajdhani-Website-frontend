const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, 'src/components/Sidebar.jsx');
let content = fs.readFileSync(sidebarPath, 'utf8');

if (!content.includes('const RefreshNavLink')) {
  // Replace <NavLink with <RefreshNavLink in the entire file
  content = content.replace(/<NavLink/g, '<RefreshNavLink');
  content = content.replace(/<\/NavLink>/g, '</RefreshNavLink>');

  const insertIndex = content.indexOf('const Sidebar = ({');
  
  const refreshNavLinkCode = `
const RefreshNavLink = ({ to, children, className, style, onClick, ...props }) => {
  const handleClick = (e) => {
    if (window.location.pathname === to) {
      e.preventDefault();
      window.location.reload();
    }
    if (onClick) {
      onClick(e);
    }
  };
  
  return (
    <NavLink to={to} className={className} style={style} onClick={handleClick} {...props}>
      {children}
    </NavLink>
  );
};

`;
  
  content = content.slice(0, insertIndex) + refreshNavLinkCode + content.slice(insertIndex);
  
  fs.writeFileSync(sidebarPath, content);
  console.log("Replaced NavLinks with RefreshNavLink.");
} else {
  console.log("RefreshNavLink already exists.");
}
