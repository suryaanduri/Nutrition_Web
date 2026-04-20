import { Routes } from '@angular/router';
import { AppShellLayoutComponent } from './core/layout/app-shell-layout.component';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { LoginScreenComponent } from './features/auth/login-screen.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginScreenComponent,
    title: 'NCM Platform | Login'
  },
  {
    path: '',
    component: AppShellLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-screen.component').then(
            (m) => m.DashboardScreenComponent
          ),
        title: 'NCM Platform | Dashboard'
      },
      {
        path: 'members',
        loadComponent: () =>
          import('./features/members/members-list-screen.component').then(
            (m) => m.MembersListScreenComponent
          ),
        title: 'NCM Platform | Members'
      },
      {
        path: 'members/:memberId',
        loadComponent: () =>
          import('./features/members/member-detail/member-detail').then((m) => m.MemberDetail),
        title: 'NCM Platform | Member Detail'
      },
      {
        path: 'evaluations',
        loadComponent: () =>
          import('./features/evaluations/evaluations-list-screen.component').then(
            (m) => m.EvaluationsListScreenComponent
          ),
        title: 'NCM Platform | Evaluations'
      },
      {
        path: 'evaluations/new',
        loadComponent: () =>
          import('./features/evaluations/evaluation-editor-screen.component').then(
            (m) => m.EvaluationEditorScreenComponent
          ),
        title: 'NCM Platform | Add Evaluation'
      },
      {
        path: 'evaluations/:evaluationId/edit',
        loadComponent: () =>
          import('./features/evaluations/evaluation-editor-screen.component').then(
            (m) => m.EvaluationEditorScreenComponent
          ),
        title: 'NCM Platform | Edit Evaluation'
      },
      {
        path: 'feed',
        loadComponent: () =>
          import('./features/feed/feed-moderation-queue-screen.component').then(
            (m) => m.FeedModerationQueueScreenComponent
          ),
        title: 'NCM Platform | Feed Moderation'
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./features/chat/chat-inbox-screen.component').then((m) => m.ChatInboxScreenComponent),
        title: 'NCM Platform | Chat'
      },
      {
        path: 'centers',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/centers/centers-management-screen.component').then(
            (m) => m.CentersManagementScreenComponent
          ),
        title: 'NCM Platform | Centers'
      }
    ]
  }
];
