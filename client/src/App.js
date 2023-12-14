import React from 'react';
import { BrowserRouter,Routes, Route} from 'react-router-dom';


/** import all components */
import Username from './components/Username';
import Password from './components/Password';
import Register from './components/Register';
import Profile from './components/Profile';
import Recovery from './components/Recovery';
import Reset from './components/Reset';
import PageNotFound from './components/PageNotFound';


/** root routes */


export default function App() {
  return (
    <BrowserRouter>
   <Routes>
    <Route path='/' element={<Username />} />
    <Route path='/register' element={<Register />} />
    <Route path='/password' element={<Password />} />
    <Route path='/profile' element={<Profile />} />
    <Route path='/recovery' element={<Recovery />} />
    <Route path='/reset' element={<Reset />} />
    <Route path='*' element={<PageNotFound />} />
   </Routes>
</BrowserRouter>
  )
}






