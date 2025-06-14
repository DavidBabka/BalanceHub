describe('Language Localization', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should switch to Slovak and update text', () => {
    cy.get('.lang-btn[data-lang="sk"]').click();

    cy.get('[data-i18n="greeting"]').invoke('text').should('not.be.empty');
    cy.get('[data-i18n="selectController"]').invoke('text').should('not.be.empty');
    cy.get('[data-i18n="connectControllerButton"]').invoke('text').should('not.be.empty');
  });

  it('should switch to English and update text', () => {
    cy.get('.lang-btn[data-lang="en"]').click();

    cy.get('[data-i18n="greeting"]').invoke('text').should('not.be.empty');
    cy.get('[data-i18n="selectController"]').invoke('text').should('not.be.empty');
    cy.get('[data-i18n="connectControllerButton"]').invoke('text').should('not.be.empty');
  });

  it('should preserve language selection across navigation', () => {
    // Switch to Slovak
    cy.get('.lang-btn[data-lang="sk"]').click();

    // Go to About
    cy.get('#about-btn').click();
    cy.get('#about').should('be.visible');
    cy.get('[data-i18n="aboutTheProject"]').invoke('text').should('not.be.empty');

    // Back to Home
    cy.get('.menu-back-btn:visible').click();
    cy.get('#home').should('be.visible');

    // Still in Slovak
    cy.get('[data-i18n="greeting"]').invoke('text').should('not.be.empty');
  });

  it('should change text for all visible [data-i18n] elements when switching language', () => {
    // Get English texts
    let englishTexts = [];
    cy.get('[data-i18n]:visible').each($el => {
      englishTexts.push($el.text());
    });

    // Switch to Slovak
    cy.get('.lang-btn[data-lang="sk"]').click();

    // Compare with new texts
    cy.get('[data-i18n]:visible').each(($el, index) => {
      cy.wrap($el).invoke('text').should('not.eq', englishTexts[index]);
    });
  });
});
