describe('Translation Accuracy (Home only switch)', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  const translations = {
    en: {
      greeting: "Welcome to the Balance Hub!",
      selectController: "Please connect a controller to get started.",
      connectControllerButton: "Connect controller",
      about: "About"
    },
    sk: {
      greeting: "Vitajte v Balance Hub!",
      selectController: "Prosím, pripojte ovládač, aby ste mohli začať.",
      connectControllerButton: "Pripojiť ovládač",
      about: "O projekte"
    }
  };

  const verifyVisibleTranslations = (langCode) => {
    const lang = translations[langCode];

    cy.get('.state:not(.hidden) [data-i18n]').each(($el) => {
      const key = $el.attr('data-i18n');
      const expected = lang[key];
      if (expected) {
        cy.wrap($el).invoke('text').should('eq', expected);
      }
    });
  };

  it('shows English translations by default', () => {
    verifyVisibleTranslations('en');
  });

  it('switches to Slovak and updates text correctly', () => {
    cy.get('.lang-btn[data-lang="sk"]').click();
    verifyVisibleTranslations('sk');
  });

  it('preserves Slovak translation when navigating to About screen', () => {
    cy.get('.lang-btn[data-lang="sk"]').click();
    cy.get('#about-btn').click();

    // Only verify what's visible on the About screen
    cy.get('.state:not(.hidden) [data-i18n="aboutTheProject"]').should('have.text', "O projekte!");
    cy.get('.state:not(.hidden) [data-i18n="aboutInformation"]').should(
      'have.text',
      "Tu nájdete informácie o tomto projekte."
    );
  });
});
