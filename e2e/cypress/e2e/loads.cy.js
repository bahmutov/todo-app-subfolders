describe('TodoMVC', () => {
  it('loads', () => {
    cy.intercept('GET', '/todos').as('todos')
    cy.visit('/')
    cy.wait('@todos')
    cy.get('input.new-todo').should('be.visible')
  })
})
