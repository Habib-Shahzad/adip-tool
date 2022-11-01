import { createRef } from 'react';
import { Home, About, BasicTools, UnderWaterTools, FourierTransformTools, FunWithBrush } from './pages';


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
        path: '/fun-with-brush',
        name: 'Fun With Brush',
        element: <FunWithBrush />,
        nodeRef: createRef()
    },

    {
        path: '/underwater-tools',
        name: 'underwater tools',
        element: <UnderWaterTools />,
        nodeRef: createRef()
    },


    {
        path: '/fourier-transform',
        name: 'fourier transform',
        element: <FourierTransformTools />,
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