import { Routes } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { SignUpComponent } from '../signup/signup.component';
import { HomepageComponent } from '../homepage/homepage.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignUpComponent },
    { path: '', component: HomepageComponent },
];
