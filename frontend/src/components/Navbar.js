import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Container, Nav, Modal, Button } from 'react-bootstrap';
import './Navbar.css'; // Import the custom navbar CSS

const NavbarComponent = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setShowLogoutModal(false);
    navigate('/login');
  };

  return (
    <>
      <Navbar expand="lg" className="navbar">
        <Container>
          <Navbar.Brand as={Link} to="/" className="navbar-brand">PathWise</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" className="navbar-toggler" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="ms-auto">
              {!token ? (
                <>
                  <Nav.Link as={Link} to="/login" className="nav-link">Login</Nav.Link>
                  <Nav.Link as={Link} to="/register" className="nav-link">Register</Nav.Link>
                </>
              ) : (
                <Nav.Link onClick={() => setShowLogoutModal(true)} className="nav-link" style={{ cursor: 'pointer' }}>
                  Logout
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Logout Modal */}
      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to log out?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleLogout}>Yes, Logout</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default NavbarComponent;
