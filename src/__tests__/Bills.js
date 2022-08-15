/**
 * @jest-environment jsdom
 */

 import {screen, waitFor} from "@testing-library/dom"
 import BillsUI from "../views/BillsUI.js"
 import { bills } from "../fixtures/bills.js"
 import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
 import {localStorageMock} from "../__mocks__/localStorage.js";
 
 import router from "../app/Router.js";
 import userEvent from "@testing-library/user-event";
 import Bills from "../containers/Bills.js";
 import { formatDate, formatStatus } from "../app/format.js";
 import mockStore from "../__mocks__/store.js";
 
 jest.mock('../app/Store', () => require('../__mocks__/store.js').default);
 
 
 describe("Given I am connected as an employee", () => {
   describe("When I am on Bills Page", () => {
     test("Then bill icon in vertical layout should be highlighted", async () => {
 
       Object.defineProperty(window, 'localStorage', { value: localStorageMock })
       window.localStorage.setItem('user', JSON.stringify({
         type: 'Employee'
       }))
       const root = document.createElement("div")
       root.setAttribute("id", "root")
       document.body.append(root)
       router() //?
       window.onNavigate(ROUTES_PATH.Bills)
       await waitFor(() => screen.getByTestId('icon-window'))
       const windowIcon = screen.getByTestId('icon-window')
       //to-do write expect expression -- classList added
       expect(windowIcon.classList).toContain("active-icon")
       
     })
     test("Then bills should be ordered from earliest to latest", () => {
       document.body.innerHTML = BillsUI({ data: bills })
       const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
       //const antiChrono = (a, b) => ((a < b) ? 1 : -1)
       const antiChrono = (a, b) => ((a.value < b.value) ? -1 : 1)
       const datesSorted = [...dates].sort(antiChrono)
       expect(dates).toEqual(datesSorted)
       
     })
   })

    // tests #2
    describe("Given I am connected as an employee", () => {
      // Check if bills without store return undefined
      test("When I have no store, then I get no bills", () => {
        const bills = new Bills({ store: null, document });
        expect(bills.getBills()).toBe(undefined);
      });
      // Check if bills connected on mockStore return 4 bills
      test("When I have store, then I get bills and list of bills", async () => {
        const bills = new Bills({ store: mockStore, document });
        const billsRetrieved = await bills.getBills();
        expect(billsRetrieved.length).toBe(4);
      });
    });
 
   //Test au loading de la page
   describe('When I am on Bills page but it is loading', () => {
     test('Then, Loading page should be rendered', () => {
       document.body.innerHTML = BillsUI({ loading: true })
       expect(screen.getAllByText('Loading...')).toBeTruthy()
     })
   })
 
   //Test message d'erreur back
   describe('When I am on Bills page but back-end send an error message', () => {
     test('Then, Error page should be rendered', () => {
       document.body.innerHTML = BillsUI({ error: 'some error message' })
       expect(screen.getAllByText('Erreur')).toBeTruthy()
     })
   })
 
 
   describe('When I am on Bills page, and i click on the "new bill" button', () => {
     test('Then I should be sent on NewBill page', async () => {
       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname })
       }
 
       Object.defineProperty(window, 'localStorage', { value: localStorageMock })
       window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
 
       const theBills = new Bills({
         document,
         onNavigate,
         store: mockStore,
         bills: bills,
         localStorage: window.localStorage,
       })
       document.body.innerHTML = BillsUI({ data: bills })
 
       const handleClickNewBill = jest.fn((e) => theBills.handleClickNewBill())
       const buttonNewBill = screen.getByText('Nouvelle note de frais')
       buttonNewBill.addEventListener('click', handleClickNewBill)
       userEvent.click(buttonNewBill)
       expect(handleClickNewBill).toHaveBeenCalled()
 
       const pageNewBill = screen.queryByText('Envoyer une note de frais')
       expect(pageNewBill).toBeTruthy()
     })
   })
 
   //Test pour l'ouverture de la modale
     describe('When I click on the icon eye', () => {
       test('A modal should open', () => {
         Object.defineProperty(window, 'localStorage', { value: localStorageMock })
         window.localStorage.setItem('user', JSON.stringify({
           type: 'Employee'
         }))
         document.body.innerHTML = BillsUI({ data: bills })
         
         const onNavigate = (pathname) => {
           document.body.innerHTML = ROUTES({ pathname })
         }
         const theBills = new Bills({
           document, onNavigate,  bills: bills, localStorage: window.localStorage
         })
   
         //const handleClickIconEye = jest.fn(theBills.handleClickIconEye)
         $.fn.modal = jest.fn()
         
         const eyeIcon = screen.getAllByTestId('icon-eye')[0]
         expect(eyeIcon).toBeTruthy()
         
         const handleClickIconEye = jest.fn((e) => theBills.handleClickIconEye(eyeIcon))
         eyeIcon.addEventListener("click", handleClickIconEye)
         userEvent.click(eyeIcon)
         expect(handleClickIconEye).toHaveBeenCalled()
       
       })
     })
   
 })
 
 
 
 //Test d'integration GET
 describe("Given I am a user connected as Employee", () => {
   describe("When I navigate to Bills page", () => {
     test("Then bills are fetched from mock API GET", async () => {
       localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
       const root = document.createElement("div")
       root.setAttribute("id", "root")
       document.body.append(root)
       router()
       window.onNavigate(ROUTES_PATH.Bills)
       await waitFor(() => screen.getByText("Mes notes de frais"))
       const buttonNewBill = await screen.queryByText('Nouvelle note de frais')
       expect(buttonNewBill).toBeTruthy()
     })
 
   describe("When an error occurs on API", () => {
     beforeEach(() => {
       jest.spyOn(mockStore, "bills")
       Object.defineProperty(
           window,
           'localStorage',
           { value: localStorageMock }
       )
       window.localStorage.setItem('user', JSON.stringify({
         type: 'Employee',
         email: "a@a"
       }))
       const root = document.createElement("div")
       root.setAttribute("id", "root")
       document.body.appendChild(root)
       router()
     })
     test("fetches bills from an API and fails with 404 message error", async () => {
       mockStore.bills.mockImplementationOnce(() => {
         return {
           list : () =>  {
             return Promise.reject(new Error("Erreur 404"))
           }
         }})
       window.onNavigate(ROUTES_PATH.Bills)
       await new Promise(process.nextTick);
       const message = await screen.getByText(/Erreur 404/)
       expect(message).toBeTruthy()
     })
 
     test("fetches messages from an API and fails with 500 message error", async () => {
       mockStore.bills.mockImplementationOnce(() => {
         return {
           list : () =>  {
             return Promise.reject(new Error("Erreur 500"))
           }
         }})
 
       window.onNavigate(ROUTES_PATH.Bills)
       await new Promise(process.nextTick);
       const message = await screen.getByText(/Erreur 500/)
       expect(message).toBeTruthy()
     })
   })
   })
 })
 
 
 