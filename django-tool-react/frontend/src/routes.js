import { createRef } from 'react';
import { Home, About, BasicTools, UnderWaterTools } from './pages';


const routes = [
    {
        path: '/',
        name: 'Home',
        element: <Home />,
        nodeRef: createRef()
    },
    {
        path: '/about',
        name: 'About',
        element: <About />,
        nodeRef: createRef()
    },

    {
        path: '/basic-tools',
        name: 'Basic Tools',
        element: <BasicTools />,
        nodeRef: createRef()
    },

    {
        path: '/underwater-tools',
        name: 'underwater tools',
        element: <UnderWaterTools />,
        nodeRef: createRef()
    },

    {
        path: '*',
        name: '404',
        element: <div></div>,
        nodeRef: createRef()
    }
]
export default routes;