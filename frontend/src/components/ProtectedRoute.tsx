import {Navigate,Outlet} from 'react-router-dom'
import {useAuthContext} from './AuthProvider'
export default function ProtectedRoute(){const {isAuthenticated}=useAuthContext();return isAuthenticated?<Outlet/>:<Navigate to="/" replace/>}
