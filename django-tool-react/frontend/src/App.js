import {
  Link,
  NavLink,
  useLocation,
  useOutlet,
} from 'react-router-dom'
import { CSSTransition, SwitchTransition } from 'react-transition-group'
import { Container, Navbar, Nav } from 'react-bootstrap'
import routes from './routes'
import { OpenCvProvider } from './lib/OpenCvProvider'
import './App.css';

function App() {
  const location = useLocation()
  const currentOutlet = useOutlet()
  const { nodeRef } =
    routes.find((route) => route.path === location.pathname) ?? {}
  return (
    <>
      <OpenCvProvider>
        <Navbar bg="dark" variant="dark">
          <Container>
            <Link to='/'>
              <Navbar.Brand>
                The Ultimate ADIP tool
              </Navbar.Brand>
            </Link>

            <Nav className="">

              <Nav.Link
                key={'/'}
                as={NavLink}
                to={'/'}
                end
              >
                {'Home'}
              </Nav.Link>

              <Nav.Link
                key={'/basic-tools'}
                as={NavLink}
                to={'/basic-tools'}
                end
              >
                {'Basic Tools'}
              </Nav.Link>

              <Nav.Link
                key={'/underwater-tools'}
                as={NavLink}
                to={'/underwater-tools'}
                end
              >
                {'Underwater Tools'}
              </Nav.Link>

              <Nav.Link
                key={'/fourier-transform'}
                as={NavLink}
                to={'/fourier-transform'}
                end
              >
                {'Fourier Transform'}
              </Nav.Link>

              <Nav.Link
                key={'/about'}
                as={NavLink}
                to={'/about'}
                end
              >
                {'About'}
              </Nav.Link>

            </Nav>
          </Container>
        </Navbar>
        <div className="app-container">
          <SwitchTransition>
            <CSSTransition
              key={location.pathname}
              nodeRef={nodeRef}
              timeout={300}
              classNames="page"
              unmountOnExit
            >
              {(state) => (
                <div ref={nodeRef} className="page">
                  {currentOutlet}
                </div>
              )}
            </CSSTransition>
          </SwitchTransition>
        </div>
      </OpenCvProvider>
    </>
  )
}


export default App;