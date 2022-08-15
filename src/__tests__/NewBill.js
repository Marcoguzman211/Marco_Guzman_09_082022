/**
 * @jest-environment jsdom
 */

 import { fireEvent, screen } from "@testing-library/dom"
 import mockStore from '../__mocks__/store.js' 
 import { localStorageMock } from '../__mocks__/localStorage.js' 
 import { ROUTES, ROUTES_PATH } from '../constants/routes.js' 
 import NewBillUI from "../views/NewBillUI.js"
 import NewBill from "../containers/NewBill.js"
 import Router from '../app/Router.js' 
 
 
 jest.mock('../app/store', () => mockStore)
 
 
 // Mock navigation and identify as an employee
 const onNavigate = (pathname) => {
   document.body.innerHTML = ROUTES({ pathname })
 }
 Object.defineProperty(window, 'LocalStorage', {value: localStorageMock})
 window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))
 
 // Tests #1
 describe('Given I am connected as an employee', () => {
   describe('When I am on NewBill Page', () => {
     beforeEach(() => { 
       Object.defineProperty(window, 'localStorage', { value: localStorageMock }) 
       Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } }) 
       window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))  
       document.body.innerHTML = `<div id="root"></div>`
       Router()      
     })
     test('Then mail icon in vertical layout should be highlighted', () => { 
       const icon = screen.getByTestId('icon-mail')
       expect(icon.className).toBe('active-icon')
     })
     test('Then I get a form and can edit a new bill', () => { 
       const html = NewBillUI({})
       document.body.innerHTML = html
       const contentTitle = screen.getAllByText('Envoyer une note de frais')
       expect(contentTitle).toBeTruthy()
     })
   })
 })
 
 
 // Test #2 handleChangeFile()
 describe('Given I am on NewBill Page',()=>{
   describe('When I need to upload an image file with the correct extension', ()=>{
     test('Then the file uploads',()=>{ 
       const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage }) // 
       const handleChangeFile = jest.fn(()=> newBill.handleChangeFile)
       const inputFile = screen.getByTestId('file') 
       inputFile.addEventListener('change', handleChangeFile) 
       fireEvent.change(inputFile,{ target: { files: [new File(['myTest.png'], 'myTest.png', {type: 'image/png'})] } }) 
       expect(handleChangeFile).toHaveBeenCalled() 
       expect(inputFile.files[0].name).toBe('myTest.png') 
     })
   })
 })
 
 
 // Test #3 handleSubmit()
 describe('Given I am on NewBill Page',()=>{
   describe("And I submit a valid bill form",()=>{
     test('Then a bill is created', async ()=>{ 
       document.body.innerHTML = NewBillUI()
       const newBill = new NewBill({ document, onNavigate, store: null, localStorage:window.localStorage }) 
       const handleSubmit = jest.fn(newBill.handleSubmit) 
       const newBillForm = screen.getByTestId('form-new-bill')
       newBillForm.addEventListener('submit', handleSubmit)
       fireEvent.submit(newBillForm)
       expect(handleSubmit).toHaveBeenCalled()
     })
   })
 })
 
 
 // POST new bill integration tests
 describe('When I do fill fields in correct format and I click on submit button', () => {
  
   // Integration test #1
   test('fetches update bill API PUT', async () => { 
     jest.spyOn(mockStore, 'bills')
     jest.spyOn(console, 'error').mockImplementation(() => {})
     Object.defineProperty(window, 'localStorage', { value: localStorageMock })
     Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })
     window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
     document.body.innerHTML = `<div id="root"></div>`
     Router()
     const onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname })}
     const newBill = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage})
     // Submit form
     const form = screen.getByTestId('form-new-bill')
     const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
     form.addEventListener('submit', handleSubmit)
     // Fire event
     fireEvent.submit(form)
     await new Promise(process.nextTick) 
     expect(console.error).not.toBeCalled()
   })
   
   // Integration test #2
   test('fetches error from an API and fails with 500 error', async () => { 
     jest.spyOn(mockStore, 'bills')
     jest.spyOn(console, 'error').mockImplementation(() => {})
     Object.defineProperty(window, 'localStorage', { value: localStorageMock })
     Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })
     window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
     document.body.innerHTML = `<div id="root"></div>`
     Router()
     const onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname })}
 
     mockStore.bills.mockImplementationOnce(() => {
       return {
         update : jest.fn().mockRejectedValueOnce(false)
       }
     })
     const newBill = new NewBill({document,  onNavigate, store: mockStore, localStorage: window.localStorage})
     // Submit form
     const form = screen.getByTestId('form-new-bill')
     const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
     form.addEventListener('submit', handleSubmit)
     // Fire event
     fireEvent.submit(form)
     await new Promise(process.nextTick)
     expect(console.error).toBeCalled()
   })
 })  