import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppShell = () => (
  <div className="layout">
    <Sidebar />
    <div className="main">
      <Topbar />
      <div className="content-shell">
        <Outlet />
      </div>
    </div>
  </div>
);

export default AppShell;
