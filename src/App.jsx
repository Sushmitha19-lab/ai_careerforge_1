import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Practice from "./pages/Practice";
import Dashboard from "./pages/Dashboard";
import CourseSelection from "./pages/CourseSelection";
import Companies from "./pages/Companies";
import CompanyPreparation from "./pages/CompanyPreparation";
import MockInterview from "./pages/MockInterview";
import Result from "./pages/Result";
import ExploreCompanies from "./pages/explorecompany";
import PreparationGuide from "./pages/PreparationGuide";
import ReadinessHub from "./pages/ReadinessHub";
import { explainInterview } from "./utils/explainSkills";
import { recordInterviewSnapshot } from "./utils/progressStore";
import { authFetch } from "./utils/api";
import {
  clearAuth,
  loadAuth,
  loadFlow,
  saveAuth,
  saveFlow,
} from "./utils/session";

import "./App.css";

function RequireAuth({ student, children }) {
  if (!student?.id) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(() => loadAuth().student);
  const [course, setCourse] = useState(() => loadFlow().course || null);
  const [company, setCompany] = useState(() => loadFlow().company || null);
  const [result, setResult] = useState(() => loadFlow().result || null);

  useEffect(() => {
    const { token } = loadAuth();
    if (!token) {
      return;
    }
    authFetch("/api/auth/me")
      .then((data) => {
        setStudent(data.user);
        saveAuth({ token, student: data.user });
      })
      .catch((error) => {
        const message = String(error.message || "");
        if (
          message.includes("Sign in") ||
          message.includes("expired") ||
          message.includes("not found")
        ) {
          clearAuth();
          setStudent(null);
        }
      });
  }, []);

  const login = ({ token, student: nextStudent }) => {
    saveAuth({ token, student: nextStudent });
    setStudent(nextStudent);
    navigate("/dashboard", { replace: true });
  };

  const logout = () => {
    clearAuth();
    setStudent(null);
    setCourse(null);
    setCompany(null);
    setResult(null);
    navigate("/login", { replace: true });
  };

  const selectCourse = (selectedCourse) => {
    setCourse(selectedCourse);
    saveFlow({ course: selectedCourse, company: null });
    setCompany(null);
    navigate("/companies");
  };

  const selectCompany = (selectedCompany) => {
    setCompany(selectedCompany);
    saveFlow({ course, company: selectedCompany });
    navigate("/preparation");
  };

  const finishInterview = async (interviewResult) => {
    const explained = explainInterview(interviewResult, course, company);
    const packed = {
      ...interviewResult,
      explained,
    };
    recordInterviewSnapshot({
      student,
      course,
      company,
      explained,
      overall: packed.overall,
    });

    try {
      const saved = await authFetch("/api/interview/results", {
        method: "POST",
        body: JSON.stringify({
          course_name: course?.name,
          company_name: company?.name,
          overall: packed.overall,
          technical: packed.technical,
          communication: packed.communication,
          problem_solving: packed.problemSolving,
          answers: packed.answers,
          explained: packed.explained,
          behavior: packed.behavior,
          voice: packed.voice,
          round_reports: packed.roundReports,
        }),
      });
      packed.savedId = saved.id;
      packed.saveError = "";
    } catch (error) {
      packed.saveError = error.message || "Could not save this interview.";
    }

    setResult(packed);
    saveFlow({ course, company, result: packed, interview: null });
    navigate("/result");
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          student?.id ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onLogin={login} />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <RequireAuth student={student}>
            <Dashboard
              student={student}
              onSelectCourse={() => navigate("/courses")}
              onPractice={() => navigate("/practice")}
              onExploreCompanies={() => navigate("/explore")}
              onPrepare={() => navigate("/guide")}
              onProgress={() => navigate("/readiness")}
              onLogout={logout}
            />
          </RequireAuth>
        }
      />

      <Route
        path="/practice"
        element={
          <RequireAuth student={student}>
            <Practice
              student={student}
              onBack={() => navigate("/dashboard")}
              onStartMock={(selectedCourse, selectedCompany) => {
                setCourse(selectedCourse);
                setCompany(selectedCompany);
                saveFlow({ course: selectedCourse, company: selectedCompany });
                navigate("/interview");
              }}
            />
          </RequireAuth>
        }
      />

      <Route
        path="/courses"
        element={
          <RequireAuth student={student}>
            <CourseSelection
              student={student}
              onBack={() => navigate("/dashboard")}
              onSelectCourse={selectCourse}
            />
          </RequireAuth>
        }
      />

      <Route
        path="/companies"
        element={
          <RequireAuth student={student}>
            {course ? (
              <Companies
                student={student}
                course={course}
                onBack={() => navigate("/courses")}
                onSelectCompany={selectCompany}
              />
            ) : (
              <Navigate to="/courses" replace />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/preparation"
        element={
          <RequireAuth student={student}>
            {course && company ? (
              <CompanyPreparation
                student={student}
                course={course}
                company={company}
                onBack={() => navigate("/companies")}
                onStartInterview={() => navigate("/interview")}
              />
            ) : (
              <Navigate to="/courses" replace />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/interview"
        element={
          <RequireAuth student={student}>
            {course && company ? (
              <MockInterview
                student={student}
                course={course}
                company={company}
                onBack={() => navigate("/preparation")}
                onFinish={finishInterview}
              />
            ) : (
              <Navigate to="/courses" replace />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/result"
        element={
          <RequireAuth student={student}>
            {result ? (
              <Result
                student={student}
                course={course}
                company={company}
                result={result}
                onDashboard={() => navigate("/dashboard")}
                onRetry={() => navigate("/interview")}
                onPrepPath={() => navigate("/readiness")}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/explore"
        element={
          <RequireAuth student={student}>
            <ExploreCompanies onBack={() => navigate("/dashboard")} />
          </RequireAuth>
        }
      />

      <Route
        path="/guide"
        element={
          <RequireAuth student={student}>
            <PreparationGuide onBack={() => navigate("/dashboard")} />
          </RequireAuth>
        }
      />

      <Route
        path="/readiness"
        element={
          <RequireAuth student={student}>
            <ReadinessHub
              student={student}
              course={course}
              company={company}
              result={result}
              onBack={() => navigate("/dashboard")}
              onPrepareCompany={() =>
                navigate(company ? "/preparation" : "/courses")
              }
            />
          </RequireAuth>
        }
      />

      <Route
        path="/"
        element={
          <Navigate to={student?.id ? "/dashboard" : "/login"} replace />
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
