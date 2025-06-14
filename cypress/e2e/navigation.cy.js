describe('User Interface Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('starts on the Home screen', () => {
    cy.get('#home').should('be.visible');
    cy.get('#about').should('have.class', 'hidden');
    cy.get('#controllers').should('have.class', 'hidden');
  });

  it('navigates to About screen and back', () => {
    cy.get('#about-btn').should('be.visible').click();
    cy.get('#about').should('be.visible');
    cy.get('#home').should('have.class', 'hidden');

    cy.get('.menu-back-btn:visible').click();
    cy.get('#home').should('be.visible');
    cy.get('#about').should('have.class', 'hidden');
  });

  it('navigates to Controllers screen and back', () => {
    cy.get('#connect-controller-btn').should('be.visible').click();
    cy.get('#controllers').should('be.visible');
    cy.get('#home').should('have.class', 'hidden');

    cy.get('.menu-back-btn:visible').click();
    cy.get('#home').should('be.visible');
    cy.get('#controllers').should('have.class', 'hidden');
  });

  it('does not display About and Controllers screens on initial load', () => {
    cy.get('#about').should('have.class', 'hidden');
    cy.get('#controllers').should('have.class', 'hidden');
  });

  it('only one screen is visible at a time', () => {
    // Go to About
    cy.get('#about-btn').click();
    cy.get('#about').should('be.visible');
    cy.get('#home').should('have.class', 'hidden');
    cy.get('#controllers').should('have.class', 'hidden');

    // Back to Home
    cy.get('.menu-back-btn:visible').click();

    // Go to Controllers
    cy.get('#connect-controller-btn').click();
    cy.get('#controllers').should('be.visible');
    cy.get('#about').should('have.class', 'hidden');
    cy.get('#home').should('have.class', 'hidden');
  });

  it('clicking About then Controllers switches screens correctly', () => {
    cy.get('#about-btn').click();
    cy.get('#about').should('be.visible');

    // Return to Home
    cy.get('.menu-back-btn:visible').click();
    cy.get('#home').should('be.visible');

    // Go to Controllers
    cy.get('#connect-controller-btn').click();
    cy.get('#controllers').should('be.visible');
  });
});
