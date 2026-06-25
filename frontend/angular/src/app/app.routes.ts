import { Routes } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { SignUpComponent } from '../signup/signup.component';
import { HomepageComponent } from '../homepage/homepage.component';
import { RecordingComponent } from '../recording/recording.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignUpComponent },
    { path: '', component: HomepageComponent },
    { path: 'recording/:id', component: RecordingComponent },
];
